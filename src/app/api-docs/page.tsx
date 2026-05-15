import { spec } from '@/lib/swagger';
import SwaggerUIDisplay from '@/components/swagger-ui';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUIDisplay spec={spec} />
    </div>
  );
}
