frontend/
  app/                                  ← expo-router: file = route
    _layout.tsx                          ← root layout (Stack, AuthProvider, SafeAreaProvider, StatusBar)
    index.tsx                             ← entry redirect (checks auth → Landing or Home)
    landing.tsx                            ← signup/login entry screen
    login.tsx
    signup.tsx
    verify-email.tsx
    forgot-password.tsx
    reset-password.tsx
    preview.tsx                              ← tweet preview (pushed from Home, has back button)

    (tabs)/                                    ← grouped folder = nested Tabs navigator
      _layout.tsx                                ← defines the bottom tab bar, protects tabs (redirects if no user)
      home.tsx
      profile.tsx

  components/
    ui/                                    ← generic, reusable anywhere
      Button.tsx
      TextField.tsx
      Card.tsx
      TweetCard.tsx
      Avatar.tsx
      Badge.tsx
      IconButton.tsx
      GoogleButton.tsx
      TopNavBar.tsx
      CroppedImage.tsx
      ScatteredIcons.tsx

    auth/                                  ← auth-flow-specific
      AuthScreenShell.tsx                    ← shared wrapper for login/signup/verify/forgot/reset

  context/
    AuthContext.tsx                        ← global auth state (user, login, signup, logout, etc.)

  hooks/
    usePressScale.ts                       ← button/icon press-shrink animation
    useGoogleAuth.ts                        ← Google OAuth flow via expo-auth-session
    useFadeUpSequence.ts                     ← reusable staggered fade-up entrance animation

  lib/
    api.ts                                 ← fetch wrapper: attaches access token, auto-refreshes on 401
    auth.ts                                 ← SecureStore read/write for access + refresh tokens

  constants/
    theme.js                               ← Colors, Spacing, Radius, FontSize