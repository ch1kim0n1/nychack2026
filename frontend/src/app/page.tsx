import { redirect } from 'next/navigation'

// Root redirects to landing, landing page lives at /home for clean routing
export default function RootPage() {
  redirect('/home')
}
