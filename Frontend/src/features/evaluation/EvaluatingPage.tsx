import { useParams } from 'react-router-dom'
import PlaceholderPage from '../shared/PlaceholderPage'

export default function EvaluatingPage() {
  const { id } = useParams()
  return <PlaceholderPage name="Evaluating" route="/evaluating/:id" id={id} />
}
