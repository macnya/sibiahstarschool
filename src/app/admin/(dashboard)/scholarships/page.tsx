import { getScholarshipRequests, getSponsorRequests, getActiveScholarships } from '@/lib/queries';
import {
  updateScholarshipStatus, deleteScholarshipRequest,
  updateSponsorStatus, deleteSponsorRequest,
  createActiveScholarship, updateActiveScholarshipStatus, deleteActiveScholarship,
} from '../../actions';
import { DeleteButton } from '@/components/admin/delete-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Phone, Mail, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SCHOLARSHIP_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', approved: 'Approved', declined: 'Declined',
};
const SPONSOR_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', contacted: 'Contacted', matched: 'Matched', declined: 'Declined',
};

export default async function AdminScholarshipsPage() {
  const [requests, sponsors, active] = await Promise.all([
    getScholarshipRequests(),
    getSponsorRequests(),
    getActiveScholarships(),
  ]);

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const pendingSponsors = sponsors.filter((s) => s.status === 'pending').length;
  const activeCount = active.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Scholarships</h1>
        <p className="text-sm text-muted-foreground">
          Applications from families, offers from sponsors, and students currently on a scholarship.
        </p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            Requests {pendingRequests > 0 && <Badge className="ml-2">{pendingRequests}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sponsors">
            Sponsors {pendingSponsors > 0 && <Badge className="ml-2">{pendingSponsors}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Scholarships <Badge variant="secondary" className="ml-2">{activeCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* --- Scholarship requests (parents) --- */}
        <TabsContent value="requests" className="space-y-4 mt-6">
          {requests.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No scholarship applications yet.</p>
            </div>
          ) : (
            requests.map((r) => (
              <Card key={r.id} className={r.status !== 'pending' ? 'opacity-70' : undefined}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{r.student_name}</p>
                      <span className="text-sm text-muted-foreground">· {r.student_level}</span>
                      <Badge variant={r.status === 'pending' ? 'default' : 'secondary'} className="text-xs">
                        {SCHOLARSHIP_STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Applied by {r.parent_name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:underline">
                        <Mail className="h-3.5 w-3.5" /> {r.email}
                      </a>
                      <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {r.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {r.status !== 'approved' && (
                      <form action={updateScholarshipStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <Button type="submit" variant="ghost" size="sm">
                          <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                        </Button>
                      </form>
                    )}
                    {r.status !== 'declined' && (
                      <form action={updateScholarshipStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="declined" />
                        <Button type="submit" variant="ghost" size="sm">
                          <X className="mr-1.5 h-3.5 w-3.5" /> Decline
                        </Button>
                      </form>
                    )}
                    {r.status !== 'pending' && (
                      <form action={updateScholarshipStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="pending" />
                        <Button type="submit" variant="ghost" size="sm">
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
                        </Button>
                      </form>
                    )}
                    <DeleteButton
                      action={deleteScholarshipRequest}
                      id={r.id}
                      confirmText="Delete this application permanently?"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{r.reason}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('en-GB')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* --- Sponsor requests --- */}
        <TabsContent value="sponsors" className="space-y-4 mt-6">
          {sponsors.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No sponsor offers yet.</p>
            </div>
          ) : (
            sponsors.map((s) => (
              <Card key={s.id} className={s.status !== 'pending' ? 'opacity-70' : undefined}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{s.sponsor_name}</p>
                      {s.organization && (
                        <span className="text-sm text-muted-foreground">· {s.organization}</span>
                      )}
                      <Badge variant={s.status === 'pending' ? 'default' : 'secondary'} className="text-xs">
                        {SPONSOR_STATUS_LABEL[s.status] ?? s.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1 hover:underline">
                        <Mail className="h-3.5 w-3.5" /> {s.email}
                      </a>
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {s.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {s.status !== 'contacted' && (
                      <form action={updateSponsorStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="contacted" />
                        <Button type="submit" variant="ghost" size="sm">Mark contacted</Button>
                      </form>
                    )}
                    {s.status !== 'declined' && (
                      <form action={updateSponsorStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="declined" />
                        <Button type="submit" variant="ghost" size="sm">
                          <X className="mr-1.5 h-3.5 w-3.5" /> Decline
                        </Button>
                      </form>
                    )}
                    {s.status !== 'pending' && (
                      <form action={updateSponsorStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="pending" />
                        <Button type="submit" variant="ghost" size="sm">
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
                        </Button>
                      </form>
                    )}
                    <DeleteButton
                      action={deleteSponsorRequest}
                      id={s.id}
                      confirmText="Delete this sponsor offer permanently?"
                    />
                  </div>
                </CardHeader>
                {s.message && (
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{s.message}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString('en-GB')}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* --- Active scholarships (matched pairs) --- */}
        <TabsContent value="active" className="space-y-6 mt-6">
          <Card>
            <CardHeader><p className="font-semibold text-primary">Record a new match</p></CardHeader>
            <CardContent>
              <form action={createActiveScholarship} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="student_name">Student name</Label>
                  <Input id="student_name" name="student_name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student_level">Level</Label>
                  <Input id="student_level" name="student_level" placeholder="e.g. Primary" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sponsor_name">Sponsor name</Label>
                  <Input id="sponsor_name" name="sponsor_name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sponsor_email">Sponsor email</Label>
                  <Input id="sponsor_email" name="sponsor_email" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sponsor_phone">Sponsor phone</Label>
                  <Input id="sponsor_phone" name="sponsor_phone" type="tel" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Add match</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {active.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No scholarships recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {active.map((a) => (
                <Card key={a.id} className={a.status === 'completed' ? 'opacity-70' : undefined}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{a.student_name}</p>
                        {a.student_level && <span className="text-sm text-muted-foreground">· {a.student_level}</span>}
                        <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {a.status === 'active' ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sponsored by {a.sponsor_name} · since {new Date(`${a.start_date}T00:00:00`).toLocaleDateString('en-GB')}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {a.sponsor_email && (
                          <a href={`mailto:${a.sponsor_email}`} className="inline-flex items-center gap-1 hover:underline">
                            <Mail className="h-3.5 w-3.5" /> {a.sponsor_email}
                          </a>
                        )}
                        {a.sponsor_phone && (
                          <a href={`tel:${a.sponsor_phone}`} className="inline-flex items-center gap-1 hover:underline">
                            <Phone className="h-3.5 w-3.5" /> {a.sponsor_phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={updateActiveScholarshipStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value={a.status === 'active' ? 'completed' : 'active'} />
                        <Button type="submit" variant="ghost" size="sm">
                          {a.status === 'active' ? 'Mark completed' : 'Reactivate'}
                        </Button>
                      </form>
                      <DeleteButton
                        action={deleteActiveScholarship}
                        id={a.id}
                        confirmText="Remove this scholarship record permanently?"
                      />
                    </div>
                  </CardHeader>
                  {a.notes && (
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{a.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
