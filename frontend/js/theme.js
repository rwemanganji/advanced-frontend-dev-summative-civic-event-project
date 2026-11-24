// Theme colors for the Tailwind CDN build, shared by every page.
// Brand palette: Maize #F8E347 (accent), Gunmetal #002428 (dark), Brunswick Green #105243 (secondary).
// Token names are unchanged so every existing class (bg-harbor, text-ink, ...) keeps working.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        harbor: { DEFAULT: '#105243', dark: '#002428' }, // Brunswick Green, darkens to Gunmetal
        mist: '#E8F0EC',                                 // light Brunswick tint for soft panels
        ink: '#002428',                                  // Gunmetal: headings, body text, dark surfaces
        coral: { DEFAULT: '#F8E347', dark: '#EAD232' },  // Maize: primary actions
        marigold: '#F8E347',                             // Maize: badges and highlights
        success: '#105243',                              // Brunswick Green: confirmations
        danger: '#B3261E',
        focus: '#105243',
        // Muted text in Gunmetal tints instead of Tailwind's blue-gray slate (both pass WCAG AA on white and mist).
        slate: { 600: '#4C6668', 700: '#335053' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  }
};
