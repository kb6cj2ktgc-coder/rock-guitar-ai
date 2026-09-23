import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Rock Guitar AI', description:'AI coaching for every rock guitarist' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
