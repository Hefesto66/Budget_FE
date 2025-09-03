# **App Name**: EcoCalc Solar

## Core Features:

- Data Input: Collects the required data through a wizard interface (average monthly energy consumption, average energy bill value, and location).
- Automated Solar Panel Calculation: Using pre-existing JavaScript calculation module, automatically suggest the appropriate number of solar panels needed based on user data, including location-based solar irradiation adjustments. This automated system acts as a tool, determining if the panel selection is optimal and offering alternative options if the tool assesses the initial calculations to be insufficient.
- System Configuration: Allows users to select the quantity of solar panels or accept the automatic calculation, and to choose panel models with varying power outputs via a dropdown menu.
- Cost Estimation: Calculates the total system cost using the pre-existing JavaScript calculation module, incorporating panel selections and any additional equipment costs.
- Savings Projection: Using the pre-existing JavaScript calculation module, display estimated monthly and annual savings, as well as the payback period for the solar system investment, presented in a clear, card-based format.
- Graphical Representation: Presents the estimated savings over time (e.g., 25 years) using Recharts to create simple bar or line graphs that visually demonstrate the long-term economic benefits.
- Report Generation & Sharing: Allows users to export a detailed quote as a PDF document and share it via WhatsApp or email using jsPDF.

## Style Guidelines:

- Background color: Light grayish-green (#F0F4F0), suggesting cleanliness and nature.
- Primary color: Medium Yellow-Green (#A5D6A7), conveying sustainability and energy, but avoiding garishness.
- Accent color: Muted Yellow (#EED281) for interactive elements, drawing attention without overwhelming the user. Convert this HSL color to #EED281
- Body font: 'PT Sans' sans-serif, for body text, giving a warm, modern feel.
- Headline font: 'Playfair' serif for headers. Where 'PT Sans' for body is preferred over 'Inter,' pair 'Playfair' for the headings.
- Use clear, simple icons related to solar energy, savings, and sustainability. Icons should be easily understandable to a non-technical audience.
- Employ a clean, responsive layout using Tailwind CSS grid and flexbox to ensure usability across devices.
- Use subtle animations (e.g., Framer Motion fades and slides) to create a smooth user experience and guide the user through the estimation process.