import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import LoadingSpinner from './LoadingSpinner';

import ErrorBoundary from './ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <App />
    </Suspense>
  </ErrorBoundary>
);
