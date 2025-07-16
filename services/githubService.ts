import { ProjectFile, GithubUser } from '../types';
import { isTextFileByPath } from '../utils/fileHelpers';

const GITHUB_API_BASE = 'https://api.github.com';

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
        throw new Error("Could not encode file content for commit.");
    }
};

const githubFetch = async (url: string, token: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    };
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${GITHUB_API_BASE}${url}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `GitHub API request failed: ${response.statusText}` }));
        throw new Error(errorData.message || `GitHub API request failed: ${response.statusText}`);
    }
    
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const verifyToken = async (token: string): Promise<{ success: boolean; message: string; user?: GithubUser }> => {
    if (!token) {
        return { success: false, message: 'Token cannot be empty.' };
    }
    try {
        const userResponse = await fetch(`${GITHUB_API_BASE}/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
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

export const getRepoContents = async (owner: string, repo: string, token: string) => {
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

export const commitFiles = async (
    owner: string,
    repo: string,
    branch: string,
    baseCommitSha: string,
    filesToCommit: ProjectFile[],
    commitMessage: string,
    token: string,
    author: GithubUser
) => {
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
            message: commitMessage,
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
