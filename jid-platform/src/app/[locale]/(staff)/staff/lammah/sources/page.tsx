import { redirect } from '@/lib/i18n/navigation'

export default function StaffLammahSourcesPage({params}:{params:{locale:string}}) {
  redirect({href:'/staff/lammah',locale:params.locale})
}
