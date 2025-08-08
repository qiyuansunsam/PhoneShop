import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <Link to="/">Go to Homepage</Link>
    </div>
  );
}

export default NotFoundPage;