import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SharedCanvas from '@/components/canvas/SharedCanvas';

interface SharedPageProps {
  params: {
    shareToken: string;
  };
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { shareToken } = params;
  const supabase = await createClient();

  // Publicly accessible query (RLS policy allows this if share_token is present)
  const { data: diagram, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('share_token', shareToken)
    .single();

  if (error || !diagram) {
    console.error('Error fetching shared diagram:', error?.message);
    notFound();
  }

  const initialData = {
    elements: diagram.elements || [],
    appState: diagram.app_state || {},
    title: diagram.title || 'Shared Diagram',
  };

  return <SharedCanvas initialData={initialData} />;
}
