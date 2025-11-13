/**
 * Settings Page
 */

'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@meatymusic/ui';
import { User, Bell, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">User Profile</h3>
                  <p className="text-sm text-muted-foreground">user@example.com</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="pt-4">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Preferences</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Theme</h4>
                  <div className="flex gap-3">
                    <Button variant="outline">Light</Button>
                    <Button variant="outline">Dark</Button>
                    <Button variant="default">System</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Notifications</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Workflow completion notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Workflow failure notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Weekly summary emails</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">API Keys</h3>
              <p className="text-muted-foreground mb-6">
                API key management coming soon. You'll be able to create and manage API keys for programmatic access.
              </p>
              <Button disabled>Create API Key</Button>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Security</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Password</h4>
                  <Button variant="outline">Change Password</Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3 text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
