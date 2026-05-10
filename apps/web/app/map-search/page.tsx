import { redirect } from 'next/navigation'

/** Legacy map entry keeps working; canonical surface is `/listings?view=split`. */
export default function MapSearchRedirectPage() {
  redirect('/listings?view=split')
}
