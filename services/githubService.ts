import { ProjectFile, GithubUser } from '../types';
import { isTextFileByPath } from '../utils/fileHelpers';
import { ErrorHandler, withErrorHandling } from '../src/utils/errorHandling';
import { githubRateLimiter, validateGitHubToken, validateGitHubUrl } from '../src/utils/validation';
import { API_CONFIG } from '../src/config/constants';

/**
 * Decodes a Base64 string into a UTF-8 string.
 * This is necessary because the standard `atob()` function does not correctly handle multi-byte UTF-8 characters.
 * @param str The Base64 encoded string.
 * @returns The decoded UTF-8 string.
 */
const b64_to_utf8 = (str: string): string => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch (e) {
        console.error("UTF-8 decoding from base64 failed", e);
        return "DECODING_ERROR: File content could not be read.";
    }
};

/**
 * Encodes a UTF-8 string into a Base64 string.
 * This is necessary because the standard `btoa()` function will throw an error for strings containing multi-byte characters.
 * @param str The UTF-8 string to encode.
 * @returns The Base64 encoded string.
 */
const utf8_to_b64 = (str: string): string => {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        console.error("UTF-8 encoding to base64 failed", e);
        throw ErrorHandler.github("Could not encode file content for commit.");
    }
};

const githubFetch = async (url: string, token: string, options: RequestInit = {}) => {
    // Rate limiting check
    if (!githubRateLimiter.isAllowed()) {
        const waitTime = Math.ceil(githubRateLimiter.getTimeUntilReset() / 1000);
        throw ErrorHandler.rateLimit();
    }

    const headers: HeadersInit = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Accept': API_CONFIG.GITHUB_ACCEPT_HEADER
    };
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_CONFIG.GITHUB_BASE_URL}${url}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
            message: `GitHub API request failed: ${response.statusText}` 
        }));
        
        if (response.status === 401) {
            throw ErrorHandler.auth(errorData.message || 'GitHub authentication failed');
        }
        if (response.status === 403) {
            throw ErrorHandler.auth('GitHub access forbidden. Check your token permissions.');
        }
        if (response.status === 404) {
            throw ErrorHandler.github('Repository not found or access denied');
        }
        if (response.status === 429) {
            throw ErrorHandler.rateLimit();
        }
        
        throw ErrorHandler.github(errorData.message || `GitHub API error: ${response.statusText}`);
    }
    
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

const verifyTokenInternal = async (token: string): Promise<{ success: boolean; message: string; user?: GithubUser }> => {
    if (!token) {
        return { success: false, message: 'Token cannot be empty.' };
    }

    // Basic token format validation
    const tokenValidation = validateGitHubToken(token);
    if (!tokenValidation.valid) {
        return { success: false, message: tokenValidation.error || 'Invalid token format' };
    }

    try {
        const userResponse = await fetch(`${API_CONFIG.GITHUB_BASE_URL}/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': API_CONFIG.GITHUB_ACCEPT_HEADER
            }
        });

        if (userResponse.status === 401) {
            const errorData = await userResponse.json();
            const message = errorData.message === "Bad credentials" 
                ? 'Authentication failed. The token is invalid or expired.'
                : errorData.message;
            return { success: false, message };
        }

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            return { success: false, message: errorData.message || `GitHub API error: ${userResponse.statusText}` };
        }

        const userData = await userResponse.json();
        const scopesHeader = userResponse.headers.get('X-OAuth-Scopes');
        const scopes = scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];

        if (!scopes.includes('repo')) {
            return { success: false, message: `Token is valid for user '${userData.login}', but is missing the required 'repo' scope.` };
        }
        
        const emails = await githubFetch('/user/emails', token);

        if (!emails || !Array.isArray(emails)) {
            return { success: false, message: `Could not fetch user emails for '${userData.login}'. Please check your GitHub email settings.` };
        }

        const primaryEmail = emails.find((e: any) => e.primary && e.verified);

        if (!primaryEmail) {
            return { success: false, message: `Could not find a primary, verified email for user '${userData.login}'. Please check your GitHub email settings.` };
        }

        const user = {
            name: userData.name || userData.login,
            email: primaryEmail.email
        };

        return { success: true, message: `Token is valid for user '${user.name}'. Required 'repo' scope found.`, user };

    } catch (error) {
        if (error instanceof Error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
        return { success: false, message: 'An unknown error occurred during verification.' };
    }
};

const getRepoContentsInternal = async (owner: string, repo: string, token: string) => {
    if (!owner || !repo) {
        throw ErrorHandler.validation('Owner and repository name are required');
    }

    const repoData = await githubFetch(`/repos/${owner}/${repo}`, token);
    const branch = repoData.default_branch || 'main';

    const branchData = await githubFetch(`/repos/${owner}/${repo}/branches/${branch}`, token);
    const latestCommitSha = branchData.commit.sha;
    const treeSha = branchData.commit.commit.tree.sha;

    const treeData = await githubFetch(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, token);

    const filePromises = treeData.tree
        .filter((item: any) => item.type === 'blob' && isTextFileByPath(item.path))
        .map(async (item: any) => {
            try {
                const blobData = await githubFetch(`/repos/${owner}/${repo}/git/blobs/${item.sha}`, token);
                const content = blobData.encoding === 'base64' ? b64_to_utf8(blobData.content) : blobData.content;
                return { path: item.path, content, isDirty: false };
            } catch (err) {
                console.warn(`Could not fetch file content for "${item.path}". Skipping file.`, err);
                return null;
            }
        });
    
    const results = await Promise.all(filePromises);
    const files = results.filter((file): file is ProjectFile => file !== null);

    return { files, latestCommitSha, branch };
};

const commitFilesInternal = async (
    owner: string,
    repo: string,
    branch: string,
    baseCommitSha: string,
    filesToCommit: ProjectFile[],
    commitMessage: string,
    token: string,
    author: GithubUser
) => {
    if (!owner || !repo || !branch || !baseCommitSha || !commitMessage || !author) {
        throw ErrorHandler.validation('All commit parameters are required');
    }

    if (!filesToCommit || filesToCommit.length === 0) {
        throw ErrorHandler.validation('No files to commit');
    }

    // Validate commit message
    if (commitMessage.trim().length === 0) {
        throw ErrorHandler.validation('Commit message cannot be empty');
    }

    const commitData = await githubFetch(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, token);
    const baseTreeSha = commitData.tree.sha;

    const blobPromises = filesToCommit.map(file => 
        githubFetch(`/repos/${owner}/${repo}/git/blobs`, token, {
            method: 'POST',
            body: JSON.stringify({ content: utf8_to_b64(file.content), encoding: 'base64' })
        })
    );
    const blobs = await Promise.all(blobPromises);

    const tree = filesToCommit.map((file, index) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobs[index].sha
    }));

    const newTree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree })
    });

    const newCommit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage.trim(),
            tree: newTree.sha,
            parents: [baseCommitSha],
            author,
            committer: author
        })
    });

    await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha })
    });

    return newCommit.sha;
};

// Export functions with error handling
export const verifyToken = withErrorHandling(verifyTokenInternal, 'GitHub Token Verification');
export const getRepoContents = withErrorHandling(getRepoContentsInternal, 'GitHub Repository Fetch');
export const commitFiles = withErrorHandling(commitFilesInternal, 'GitHub Commit');
