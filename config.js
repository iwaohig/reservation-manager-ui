// 複数リポジトリ対応設定ファイル
const CONFIG = {
    // UI設定
    ui: {
        title: "予約管理システム",
        description: "GitHub上のスケジュール設定を管理",
        showAuthSection: true,
        debug: false
    },
    
    // デフォルトリポジトリ設定
    defaultRepository: {
        owner: 'iwaohig',
        repo: 'timescar-automation-v2'
    },
    
    // プリセットリポジトリ（ドロップダウンで選択可能）
    repositories: [
        {
            name: 'タイムズカー自動化',
            owner: 'iwaohig',
            repo: 'timescar-automation-v2',
            configPath: 'config/schedule.json',
            workflowPath: '.github/workflows/two-stage-automation.yml'
        }
        // 他のプロジェクトも追加可能
        // {
        //     name: '別のプロジェクト',
        //     owner: 'username',
        //     repo: 'other-project',
        //     configPath: 'config/schedule.json',
        //     workflowPath: '.github/workflows/automation.yml'
        // }
    ],
    
    // GitHub Pages設定
    githubPages: {
        enabled: true,
        baseUrl: 'https://iwaohig.github.io/reservation-manager-ui'
    },
    
    // 認証設定
    auth: {
        tokenStorageKey: 'github_auth_token',
        encryptionEnabled: true,
        requiredScopes: ['repo'],
        tokenValidationUrl: 'https://api.github.com/user'
    },
    
    // ファイルパス設定（カスタマイズ可能）
    paths: {
        schedule: 'config/schedule.json',
        workflow: '.github/workflows/two-stage-automation.yml'
    }
};