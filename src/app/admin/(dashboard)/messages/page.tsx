import { getContactMessages } from '@/lib/queries';
import { toggleMessageHandled, deleteMessage } from '../../actions';
import { DeleteButton } from '@/components/admin/delete-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();
  const unread = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Messages</h1>
        <p className="text-sm text-muted-foreground">
          {unread > 0
            ? `${unread} awaiting a reply.`
            : 'Enquiries submitted through the contact form.'}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No enquiries yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id} className={m.handled ? 'opacity-60' : undefined}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{m.name}</p>
                    {!m.handled && <Badge className="text-xs">New</Badge>}
                  </div>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.subject && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Subject: {m.subject}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={toggleMessageHandled}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="handled" value={String(!m.handled)} />
                    <Button type="submit" variant="ghost" size="sm">
                      {m.handled ? (
                        <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen</>
                      ) : (
                        <><Check className="mr-1.5 h-3.5 w-3.5" /> Mark done</>
                      )}
                    </Button>
                  </form>
                  <DeleteButton
                    action={deleteMessage}
                    id={m.id}
                    confirmText="Delete this enquiry permanently?"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString('en-GB')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
