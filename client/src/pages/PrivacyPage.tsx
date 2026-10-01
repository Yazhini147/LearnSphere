import { Link } from 'react-router-dom';
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-16 max-w-3xl">
        <Link to="/" className="text-primary text-sm hover:underline mb-8 block">← Back to LearnSphere</Link>
        <h1 className="mb-4">Privacy Policy</h1>
        <p className="text-text-muted">Privacy policy content will be added here.</p>
      </div>
    </div>
  );
}
