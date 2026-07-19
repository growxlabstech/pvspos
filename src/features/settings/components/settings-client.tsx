'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSettingsSchema, UpdateSettingsSchemaInput } from '../schemas/settings.schema';
import { useSettings, useUpdateSettings } from '../hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function SettingsClient() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSettingsSchemaInput>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      fullName: '',
      storeName: '',
      storeAddress: '',
      phone: '',
      gstNumber: '',
      currency: 'INR',
      taxRate: 18,
      gstEnabled: true,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        fullName: settings.fullName || '',
        storeName: settings.storeName || '',
        storeAddress: settings.storeAddress || '',
        phone: settings.phone || '',
        gstNumber: settings.gstNumber || '',
        currency: settings.currency || 'INR',
        taxRate: Number(settings.taxRate) || 18,
        gstEnabled: settings.gstEnabled !== false,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UpdateSettingsSchemaInput) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success('Settings updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Store Configuration</CardTitle>
            <CardDescription>Manage store name, address, tax rate, and GST details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" placeholder="e.g. PVS Retail Store" {...register('storeName')} />
                {errors.storeName && (
                  <p className="text-xs text-destructive">{errors.storeName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Store Phone Number</Label>
                <Input id="phone" placeholder="+91 9876543210" {...register('phone')} />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input id="storeAddress" placeholder="123 Main Street, City, State, Pincode" {...register('storeAddress')} />
              {errors.storeAddress && (
                <p className="text-xs text-destructive">{errors.storeAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GSTIN / Tax ID</Label>
                <Input id="gstNumber" placeholder="22AAAAA0000A1Z5" {...register('gstNumber')} />
                {errors.gstNumber && (
                  <p className="text-xs text-destructive">{errors.gstNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input id="currency" placeholder="INR" {...register('currency')} />
                {errors.currency && (
                  <p className="text-xs text-destructive">{errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input id="taxRate" type="number" step="0.1" placeholder="18" {...register('taxRate')} />
                {errors.taxRate && (
                  <p className="text-xs text-destructive">{errors.taxRate.message}</p>
                )}
              </div>
            </div>

            {/* GST Enabled Toggle */}
            <div className="pt-4 border-t flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">GST Billing Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle whether GST taxes are calculated and added to invoices. If disabled, all bills will have zero tax.
                </p>
              </div>
              <Controller
                control={control}
                name="gstEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Personal profile and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Admin User" {...register('fullName')} />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={settings?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email address managed via Supabase Auth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={isSubmitting || updateSettings.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
