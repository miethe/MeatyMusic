import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { Form, FormField } from '../Form';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal dialog component built on Radix UI with proper focus management and keyboard navigation. Also exported as Modal for semantic clarity.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Basic Dialog</DialogTitle>
          <DialogDescription>
            This is a basic dialog with a title and description. It demonstrates the fundamental structure of the dialog component.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here. This can be any React content.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', { name, email });
      setOpen(false);
      setName('');
      setEmail('');
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Create Account</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Fill in the information below to create your new account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </FormField>

            <FormField label="Email Address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
      console.log('Action confirmed');
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Item</Button>
        </DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item and remove it from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Long Dialog</Button>
      </DialogTrigger>
      <DialogContent size="lg" className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read through our terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <h3 className="font-semibold">Section {i + 1}</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ControlledDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    const handleNext = () => {
      if (step < 3) {
        setStep(step + 1);
      } else {
        setOpen(false);
        setStep(1);
      }
    };

    const handlePrevious = () => {
      if (step > 1) {
        setStep(step - 1);
      }
    };

    return (
      <>
        <Button onClick={() => setOpen(true)}>
          Start Wizard
        </Button>

        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) setStep(1);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup Wizard - Step {step} of 3</DialogTitle>
              <DialogDescription>
                {step === 1 && "Welcome to the setup wizard. Let's get started."}
                {step === 2 && "Configure your preferences and settings."}
                {step === 3 && "Review your settings and complete the setup."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              {step === 1 && (
                <div>
                  <h3 className="font-semibold mb-2">Welcome!</h3>
                  <p>This wizard will help you set up your account in just a few steps.</p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-2">Preferences</h3>
                  <FormField label="Display Name">
                    <Input placeholder="Enter your display name" />
                  </FormField>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="font-semibold mb-2">Complete Setup</h3>
                  <p>You're all set! Click finish to complete the setup process.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {step === 3 ? 'Finish' : 'Next'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

// Size Variants Stories
export const SizeSmall: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Small Dialog (448px)</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Small Dialog</DialogTitle>
          <DialogDescription>
            This dialog uses the 'sm' size variant (max-w-md = 448px). Perfect for simple confirmations.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">Ideal for quick confirmations and simple messages.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small dialog variant (448px) - ideal for simple confirmations and alerts.',
      },
    },
  },
};

export const SizeMedium: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Medium Dialog (512px)</Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Medium Dialog</DialogTitle>
          <DialogDescription>
            This dialog uses the 'md' size variant (max-w-lg = 512px). This is the default size.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">The default size works well for most use cases including forms and moderate content.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Medium dialog variant (512px) - the default size for most dialogs.',
      },
    },
  },
};

export const SizeLarge: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Large Dialog (672px)</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Large Dialog</DialogTitle>
          <DialogDescription>
            This dialog uses the 'lg' size variant (max-w-2xl = 672px). Great for forms with more fields.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm">Provides more horizontal space for complex forms or content that needs breathing room.</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name">
              <Input placeholder="John" />
            </FormField>
            <FormField label="Last Name">
              <Input placeholder="Doe" />
            </FormField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large dialog variant (672px) - suitable for forms with multiple fields or richer content.',
      },
    },
  },
};

export const SizeExtraLarge: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>XL Dialog (896px)</Button>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Extra Large Dialog</DialogTitle>
          <DialogDescription>
            This dialog uses the 'xl' size variant (max-w-4xl = 896px). Perfect for XL Prompt Cards and rich content.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm">Provides ample space for complex components like XL-sized Prompt Cards, detailed forms, or rich media content.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-panel rounded-md">
              <h4 className="font-semibold mb-2">Feature 1</h4>
              <p className="text-sm text-text-muted">Description of feature one with more details.</p>
            </div>
            <div className="p-4 bg-panel rounded-md">
              <h4 className="font-semibold mb-2">Feature 2</h4>
              <p className="text-sm text-text-muted">Description of feature two with more details.</p>
            </div>
            <div className="p-4 bg-panel rounded-md">
              <h4 className="font-semibold mb-2">Feature 3</h4>
              <p className="text-sm text-text-muted">Description of feature three with more details.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Extra-large dialog variant (896px) - designed for XL Prompt Cards and complex rich content.',
      },
    },
  },
};

export const SizeFull: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Full Width Dialog (95vw)</Button>
      </DialogTrigger>
      <DialogContent size="full" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Full Width Dialog</DialogTitle>
          <DialogDescription>
            This dialog uses the 'full' size variant (max-w-[95vw]). Responsive and takes up most of the viewport.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm">Ideal for complex dashboards, data tables, or any content that needs maximum horizontal space.</p>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 bg-panel rounded-md">
                <h4 className="font-semibold mb-2">Item {i + 1}</h4>
                <p className="text-sm text-text-muted">Content for item {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-width dialog variant (95vw) - responsive and takes up most of the viewport width.',
      },
    },
  },
};

export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-panel rounded-md">
        <h3 className="font-semibold mb-2">Dialog Size Variants</h3>
        <p className="text-sm text-text-muted mb-4">
          The Dialog component supports 5 size variants to accommodate different content types and use cases.
        </p>
        <ul className="text-sm space-y-2">
          <li><strong>sm (448px)</strong> - Simple confirmations and alerts</li>
          <li><strong>md (512px)</strong> - Default size for most dialogs</li>
          <li><strong>lg (672px)</strong> - Forms with multiple fields</li>
          <li><strong>xl (896px)</strong> - XL Prompt Cards and rich content</li>
          <li><strong>full (95vw)</strong> - Maximum width for complex layouts</li>
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Small</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Small (448px)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">Compact and focused.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Medium</Button>
          </DialogTrigger>
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>Medium (512px)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">Default size for standard use cases.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Large</Button>
          </DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Large (672px)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">More space for complex content.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">XL</Button>
          </DialogTrigger>
          <DialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Extra Large (896px)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">Ample space for rich components like XL Prompt Cards.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Full</Button>
          </DialogTrigger>
          <DialogContent size="full">
            <DialogHeader>
              <DialogTitle>Full Width (95vw)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">Maximum available width for complex layouts.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive comparison of all 5 dialog size variants.',
      },
    },
  },
};

// Accessibility test story
export const AccessibilityTest: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Accessible Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>
            This dialog demonstrates proper accessibility features including focus management, ARIA attributes, and keyboard navigation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            Try navigating with the Tab key to see focus management in action. Press Escape to close the dialog.
          </p>
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="mr-2">First Button</Button>
            <Button variant="outline" className="mr-2">Second Button</Button>
            <Input placeholder="Focus trap works here too" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with proper focus management, ARIA attributes, and keyboard navigation support.',
      },
    },
  },
};

// Animation demonstration story
export const AnimationDemo: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Animated Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Smooth Animations</DialogTitle>
          <DialogDescription>
            This dialog features GPU-accelerated animations with a 250ms duration. The overlay fades in, while the content zooms and slides from the top.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="font-semibold mb-2">Animation Features:</h3>
          <ul className="space-y-2 text-sm">
            <li>• GPU-accelerated (transform and opacity only)</li>
            <li>• 250ms duration for optimal perceived performance</li>
            <li>• Smooth easing curves (cubic-bezier)</li>
            <li>• No layout shift during animation</li>
            <li>• Respects prefers-reduced-motion preference</li>
          </ul>
        </div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the smooth CSS animations with GPU acceleration. Animations respect user motion preferences.',
      },
    },
  },
};

// Reduced motion simulation story
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-panel rounded-md">
        <p className="text-sm text-text-muted mb-2">
          <strong>Note:</strong> To test reduced motion, enable it in your operating system:
        </p>
        <ul className="text-sm text-text-muted space-y-1 ml-4">
          <li>• <strong>macOS:</strong> System Settings → Accessibility → Display → Reduce motion</li>
          <li>• <strong>Windows:</strong> Settings → Ease of Access → Display → Show animations</li>
          <li>• <strong>Linux:</strong> Varies by desktop environment</li>
        </ul>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Test Reduced Motion</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reduced Motion Support</DialogTitle>
            <DialogDescription>
              When prefers-reduced-motion is enabled, all animations are disabled for instant transitions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              This dialog respects the <code className="bg-panel px-2 py-1 rounded">prefers-reduced-motion</code> media query.
            </p>
            <p className="text-sm text-text-muted">
              With reduced motion enabled, the dialog appears instantly without fade, zoom, or slide animations.
              This improves accessibility for users with vestibular disorders or motion sensitivity.
            </p>
          </div>
          <DialogFooter>
            <Button>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates reduced motion support. Enable prefers-reduced-motion in your OS to see instant transitions.',
      },
    },
  },
};
