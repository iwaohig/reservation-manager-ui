// GitHub OAuth認証モジュール
class GitHubOAuth {
    constructor(config) {
        this.clientId = config.oauth.clientId;
        this.redirectUri = config.oauth.redirectUri;
        this.scope = config.oauth.scope;
    }

    // OAuth認証フローを開始
    startAuthFlow() {
        const state = this.generateRandomString(32);
        localStorage.setItem('oauth_state', state);
        
        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.set('client_id', this.clientId);
        authUrl.searchParams.set('redirect_uri', this.redirectUri);
        authUrl.searchParams.set('scope', this.scope);
        authUrl.searchParams.set('state', state);
        
        window.location.href = authUrl.toString();
    }

    // OAuth認証完了後の処理
    handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('oauth_state');

        if (!code || state !== storedState) {
            throw new Error('OAuth認証エラー: 無効なコールバック');
        }

        // Personal Access Tokenの代わりにOAuthトークンを使用
        // 注意: GitHub Pagesでは直接トークン交換ができないため、
        // 別のサービス（Netlify Functions等）が必要
        console.warn('OAuth認証は別のサービスでの実装が必要です');
        
        return code;
    }

    generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
}

// Personal Access Token認証（GitHub Pages推奨方法）
class GitHubTokenAuth {
    constructor() {
        this.storageKey = 'github_pat_encrypted';
    }

    // トークンを暗号化して保存（簡易実装）
    saveToken(token) {
        try {
            const encrypted = btoa(token); // 簡易暗号化（base64）
            localStorage.setItem(this.storageKey, encrypted);
            return true;
        } catch (e) {
            console.error('トークン保存エラー:', e);
            return false;
        }
    }

    // トークンを復号化して取得
    getToken() {
        try {
            const encrypted = localStorage.getItem(this.storageKey);
            if (!encrypted) return null;
            return atob(encrypted); // 復号化
        } catch (e) {
            console.error('トークン取得エラー:', e);
            return null;
        }
    }

    // トークンを削除
    clearToken() {
        localStorage.removeItem(this.storageKey);
    }

    // トークンの有効性を確認
    async validateToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
}