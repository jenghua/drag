import dynamic from 'next/dynamic';

const DragEditor = dynamic(() => import('../components/DragEditor'), { ssr: false });

export default function Home() {
  return <DragEditor />;
}
