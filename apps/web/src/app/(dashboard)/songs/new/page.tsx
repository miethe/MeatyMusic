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

      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isComplete
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isComplete ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">{currentStepConfig.label}</h2>

          {currentStep === 0 && (
            <SongInfoStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 1 && <div className="py-12 text-center text-muted-foreground">Style editor coming soon</div>}
          {currentStep === 2 && <div className="py-12 text-center text-muted-foreground">Lyrics editor coming soon</div>}
          {currentStep === 3 && <div className="py-12 text-center text-muted-foreground">Persona selector coming soon</div>}
          {currentStep === 4 && <div className="py-12 text-center text-muted-foreground">Producer notes editor coming soon</div>}
          {currentStep === 5 && <ReviewStep formData={formData} />}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Song Title *</label>
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg border bg-background"
          placeholder="Enter song title..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          className="w-full px-4 py-2 rounded-lg border bg-background"
          rows={4}
          placeholder="Describe your song concept..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Genre *</label>
          <select
            className="w-full px-4 py-2 rounded-lg border bg-background"
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
          <label className="block text-sm font-medium mb-2">Mood</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border bg-background"
            placeholder="e.g., upbeat, melancholic..."
          />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ formData }: { formData: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Song Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Title</dt>
            <dd className="font-medium">{formData.name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Genre</dt>
            <dd className="font-medium">{formData.genre || 'Not set'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-muted-foreground">Description</dt>
            <dd className="font-medium">{formData.description || 'Not set'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Note: Style, Lyrics, Persona, and Producer Notes editors are coming soon.
          You'll be able to define these entities in future steps.
        </p>
      </div>
    </div>
  );
}
