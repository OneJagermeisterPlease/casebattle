import { notFound } from 'next/navigation';
import { BakeCover } from '@/components/BakeCover';

/** Dev-only: renders one live CaseArt in isolation for tools/bake_covers.mjs. Not served in production. */
export default async function DevCoverPage({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { slug } = await params;
  return <BakeCover initialSlug={slug} />;
}
