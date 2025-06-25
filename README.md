# 📋 Reservation Manager UI

A modern, mobile-responsive web interface for managing GitHub-based automation project schedules and reservations.

## 🚀 Features

- **GitHub Integration**: Direct editing of schedule.json files via GitHub API
- **Cron Schedule Visualization**: Automatic calculation of next execution times
- **Mobile-First Design**: Optimized for smartphones and tablets  
- **Multi-Repository Support**: Manage multiple automation projects
- **Secure Authentication**: Personal Access Token with local encryption
- **Real-time Updates**: Live synchronization with GitHub repositories

## 🎯 Use Cases

- Meeting room booking systems
- Equipment rental management
- Event scheduling automation
- Any GitHub Actions-based reservation system

## 🔧 Quick Start

1. **Access the Web App**
   - Visit: https://iwaohig.github.io/reservation-manager-ui/
   - Or open `index.html` locally in your browser

2. **GitHub Authentication**
   - Create a [Personal Access Token](https://github.com/settings/tokens)
   - Required scope: `repo`
   - Enter your token and repository information

3. **Start Managing**
   - View upcoming schedules
   - Add/edit/delete reservations
   - Toggle enabled/disabled status

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-optimized interface
- Offline settings storage
- Fast loading and smooth animations

## 🔒 Security

- **Client-side only**: No server-side processing
- **Local storage**: Tokens encrypted in your browser
- **No data collection**: Your information stays private
- **HTTPS**: Secure communication with GitHub API

## 🏗️ Architecture

```
reservation-manager-ui/
├── index.html          # Main application
├── config.js           # Configuration settings
├── auth.js             # Authentication module
└── README.md           # Documentation
```

## ⚙️ Configuration

Edit `config.js` to customize:

- Default repository settings
- UI appearance
- Authentication options
- File paths

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 🆘 Support

- [Create an issue](https://github.com/iwaohig/reservation-manager-ui/issues)
- [View documentation](https://github.com/iwaohig/reservation-manager-ui/wiki)

---

*Built with vanilla HTML/CSS/JavaScript for maximum compatibility and performance.*
