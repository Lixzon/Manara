import { PageHeader } from '../../components/ui/common';
import { DailyPracticeCard } from './DailyPracticeCard';
import { QhdReminderCard } from './QhdReminderCard';

export default function JourneyPage() {
  return (
    <div className="page-enter space-y-3">
      <PageHeader
        title="Mishka"
        subtitle="A daily companion for worship, remembrance, and reflection."
      />
      <QhdReminderCard />
      <DailyPracticeCard />
    </div>
  );
}
