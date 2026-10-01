import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">404</div>
      <h1 className="text-2xl font-bold text-text-deep mb-2">Page not found</h1>
      <p className="text-text-muted mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-md btn-primary">Go home</Link>
    </div>
  );
}
