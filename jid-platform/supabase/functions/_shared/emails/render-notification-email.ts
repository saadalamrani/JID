/** @jsxImportSource https://esm.sh/react@18.3.1 */
import { render } from 'https://esm.sh/@react-email/render@1.0.5'
import {
  NotificationEmail,
  type NotificationEmailProps,
} from './notification-email.tsx'

export async function renderNotificationEmail(props: NotificationEmailProps): Promise<string> {
  return await render(<NotificationEmail {...props} />)
}
