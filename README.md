Landing Page
<img width="1698" height="1300" alt="image" src="https://github.com/user-attachments/assets/f9afe102-ba1d-4028-958c-c8ee89dc7386" />

Login Page
<img width="1701" height="1298" alt="image" src="https://github.com/user-attachments/assets/7b1566cc-9786-421f-ac67-d584078c8b18" />

Signup page
<img width="1700" height="1263" alt="image" src="https://github.com/user-attachments/assets/159946c7-15f5-4a72-9277-8a32289db586" />

Cookie Retreival Guide
<img width="1694" height="1267" alt="image" src="https://github.com/user-attachments/assets/0c6f43e3-0bcc-410c-b4db-37bf758ef1a7" />

Dashboard
<img width="1698" height="1267" alt="image" src="https://github.com/user-attachments/assets/10033b0d-89e9-4d8f-832e-5f144dc5157c" />




# 🚀 Python TextNow - Send & Receive Messages

<div align="center">

![Python TextNow Preview](https://raw.githubusercontent.com/zodyking/phython-textnow-demo-app/main/preview.png)

**A modern, mobile-first Next.js application for sending SMS and MMS messages using the Python TextNow API**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## ✨ Features

- 📱 **Mobile-First Design** - Beautiful, responsive UI optimized for all devices
- 🎨 **Modern UI** - Electric, gradient-based design with Framer Motion animations
- 📤 **Send SMS** - Send text messages to any phone number instantly
- 🖼️ **Send MMS** - Send images with drag-and-drop support
- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- ⚡ **Real-time Status** - Step-by-step sending status with progress updates
- 🎯 **Simple Interface** - Clean, intuitive design for quick messaging

## 🎬 Preview

The landing page features a stunning dark theme with animated gradients, interactive elements, and a modern design that makes messaging effortless.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+ (for TextNow API integration)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zodyking/phython-textnow-demo-app.git
   cd phython-textnow-demo-app
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   JWT_SECRET=your-secret-key-here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Setup Instructions

### 1. Create an Account

1. Visit the signup page
2. Create a username and password for the app
3. Enter your TextNow username
4. Get your `connect.sid` cookie from TextNow.com (see [Cookie Guide](COOKIE_GUIDE.md))
5. Your browser's User-Agent will be automatically captured

### 2. Getting Your TextNow Cookie

The app includes helpful tools to get your `connect.sid` cookie:

- **Bookmarklet** - Drag a bookmarklet to your browser that auto-copies the cookie
- **Console Script** - Paste a script into your browser console
- **Manual Instructions** - Step-by-step guide in the signup page

See [COOKIE_GUIDE.md](COOKIE_GUIDE.md) for detailed instructions.

### 3. Sending Messages

1. **Text Messages**: Enter a phone number and message, then click "Send Message"
2. **MMS (Images)**: 
   - Drag and drop an image or click "Select Image"
   - Optionally add a text message
   - The image will be sent first, then the message after 10 seconds
   - Watch the step-by-step progress in the status modal

## 🏗️ Project Structure

```
python-textnow/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication routes
│   │   ├── messages/      # Message sending routes
│   │   └── user/          # User settings routes
│   ├── dashboard/         # Main messaging dashboard
│   ├── login/             # Login page
│   ├── settings/          # User settings page
│   ├── signup/            # Signup page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── lib/
│   ├── auth.ts            # JWT authentication
│   ├── cookie.ts           # Cookie utilities
│   ├── db.ts              # Database utilities
│   └── phone.ts           # Phone number utilities
├── data/
│   └── users.json         # User database (gitignored)
├── uploads/               # Temporary file uploads (gitignored)
├── python_service.py      # Python TextNow API service
├── requirements.txt       # Python dependencies
└── package.json           # Node.js dependencies
```

## 🛠️ Technologies Used

- **[Next.js 15.1.5](https://nextjs.org/)** - React framework with App Router
- **[React 19.0.0](https://reactjs.org/)** - UI library
- **[TypeScript 5.7.2](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 3.4.17](https://tailwindcss.com/)** - Utility-first CSS
- **[Framer Motion 11.15.0](https://www.framer.com/motion/)** - Animation library
- **[Heroicons 2.2.0](https://heroicons.com/)** - Icon library
- **[pythontextnow](https://github.com/joeyagreco/pythontextnow)** - Python TextNow API wrapper
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing
- **[jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)** - JWT tokens

## 📚 API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Messages
- `POST /api/messages/send` - Send text message
- `POST /api/messages/send-media` - Send image/MMS

### User
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT tokens stored in httpOnly cookies
- User-Agent matching for TextNow API (prevents 403 errors)
- All sensitive data excluded from git (see `.gitignore`)

## 📖 Documentation

- [Cookie Guide](COOKIE_GUIDE.md) - How to get your TextNow cookie
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Developers

- **ZodyKing** - [GitHub](https://github.com/zodyking)
- **Joey Greco** - Python TextNow API - [GitHub](https://github.com/joeyagreco/pythontextnow)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [pythontextnow](https://github.com/joeyagreco/pythontextnow) by Joey Greco for the Python TextNow API wrapper
- TextNow for providing the messaging platform

---

<div align="center">

**Made with ❤️ using Next.js and Python**

⭐ Star this repo if you find it helpful!

</div>
