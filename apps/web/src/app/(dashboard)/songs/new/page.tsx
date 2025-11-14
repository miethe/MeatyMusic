/**
 * New Song Page
 * Multi-step wizard for creating a new song
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Music2,
  Palette,
  FileText,
  User,
  Settings,
  Eye,
} from 'lucide-react';

const WIZARD_STEPS = [
  { id: 'info', label: 'Song Info', icon: Music2 },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'lyrics', label: 'Lyrics', icon: FileText },
  { id: 'persona', label: 'Persona', icon: User },
  { id: 'producer', label: 'Producer Notes', icon: Settings },
  { id: 'review', label: 'Review', icon: Eye },
] as const;

export default function NewSongPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    genre: '',
    mood: [] as string[],
  });

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.SONGS);
  };

  const handleSubmit = () => {
    // TODO: Implement song creation
    console.log('Creating song:', formData);
    router.push(ROUTES.SONGS);
  };

  const currentStepConfig = WIZARD_STEPS[currentStep];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create New Song"
        description="Follow the steps to design your song"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-ui ${
                        isActive
                          ? 'bg-primary shadow-lg text-primaryForeground scale-110'
                          : isComplete
                            ? 'bg-success text-white'
                            : 'bg-panel border-2 border-border text-text-muted'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-ui ${
                        isActive
                          ? 'text-text-strong'
                          : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded transition-colors duration-ui ${
                        isComplete ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-surface border-border shadow-elev1 p-10 mb-6 animate-slide-up">
          <h2 className="text-2xl font-semibold text-text-strong mb-8">{currentStepConfig?.label}</h2>

          {currentStep === 0 && (
            <SongInfoStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 1 && <div className="py-16 text-center text-text-muted">Style editor coming soon</div>}
          {currentStep === 2 && <div className="py-16 text-center text-text-muted">Lyrics editor coming soon</div>}
          {currentStep === 3 && <div className="py-16 text-center text-text-muted">Persona selector coming soon</div>}
          {currentStep === 4 && <div className="py-16 text-center text-text-muted">Producer notes editor coming soon</div>}
          {currentStep === 5 && <ReviewStep formData={formData} />}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancel} className="px-6 py-3">
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="px-6 py-3">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
              >
                <Check className="w-4 h-4 mr-2" />
                Create Song
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SongInfoStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-text-strong mb-3">Song Title *</label>
        <input
          type="text"
          className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
          placeholder="Enter song title..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-strong mb-3">Description</label>
        <textarea
          className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui resize-none"
          rows={5}
          placeholder="Describe your song concept..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-strong mb-3">Genre *</label>
          <select
            className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          >
            <option value="">Select genre...</option>
            <option value="pop">Pop</option>
            <option value="rock">Rock</option>
            <option value="hip-hop">Hip Hop</option>
            <option value="electronic">Electronic</option>
            <option value="country">Country</option>
            <option value="r&b">R&B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-strong mb-3">Mood</label>
          <input
            type="text"
            className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
            placeholder="e.g., upbeat, melancholic..."
          />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ formData }: { formData: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-panel border-2 border-border rounded-xl p-8">
        <h3 className="text-lg font-semibold text-text-strong mb-6">Song Information</h3>
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-text-muted mb-2">Title</dt>
            <dd className="font-medium text-text-base text-lg">{formData.name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-muted mb-2">Genre</dt>
            <dd className="font-medium text-text-base text-lg">{formData.genre || 'Not set'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm font-medium text-text-muted mb-2">Description</dt>
            <dd className="font-medium text-text-base">{formData.description || 'Not set'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-info/10 border-2 border-info/30 rounded-xl p-6">
        <p className="text-sm text-text-base leading-relaxed">
          Note: Style, Lyrics, Persona, and Producer Notes editors are coming soon.
          You'll be able to define these entities in future steps.
        </p>
      </div>
    </div>
  );
}
