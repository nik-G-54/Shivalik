import { useParams } from 'react-router-dom'
import PlaceholderPage from '../shared/PlaceholderPage'

export default function ReportPage() {
  const { id } = useParams()
  return <PlaceholderPage name="Report" route="/report/:id" id={id} />
}
