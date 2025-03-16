# FinPlanner

A personal financial planning web application that helps users track expenses, manage credit card payments, and monitor recurring transactions.

## Features

- **Dashboard Overview**: View total current debt, payments made, credit card expenses, and recurring payments at a glance
- **Transaction Management**: Add new transactions with detailed information
- **Categorized Expenses**: Organize expenses by categories like food, transportation, education, etc.
- **Payment Types**: Track different payment methods (credit card, recurring payments)
- **Credit Card Installments**: Manage installment payments with up to 12 monthly payments
- **Date Navigation**: Easily switch between months and years to view historical data
- **Responsive Design**: Works on mobile and desktop devices

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.3
- Firebase (Authentication and Realtime Database)
- Progressive Web App (PWA) capabilities

## NPM LIST
$ npm list -g --depth=0

$ npm list -g --depth=0 (pacotes instalados na máquina)
/usr/local/lib
├── corepack@0.31.0
├── expo-cli@6.3.12
├── npm@11.2.0
├── react-native-cli@2.0.1
├── serve@14.2.4
├── typescript@5.8.2
├── vite@6.2.0
└── yarn@1.22.22

$$ Dica CSS $$
          padding: min (5em, 8%); //Ajusta o preenchimento da caixa de acordo com o tamanho da tela.
          font-size: clamp(1.8rem, calc (7vw + 1rem), 5rem); //Ajusta o tamanho da fonte da caixa de acordo com o tamanho da tela. **Tamanho mínimo, preferencial e máximo.**

          height: 100vh; //Define a altura da caixa como 100% da altura da tela.
          height: 100dvh; //Define a altura da caixa como 100% da altura da tela, incluindo a barra de rolagem. (Utilizado em dispositivos móveis)
