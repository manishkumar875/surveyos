/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash,
  Globe,
  Mail,
  Phone,
  User,
  Calendar,
  FolderKanban,
  Link as LinkIcon,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { supplierApi } from '@/lib/supplier-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { Supplier } from '@/types';

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);

    const loadSupplier = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await supplierApi.getSupplier(orgId, supplierId);
        setSupplier(data);
      } catch (err) {
        console.error('Failed to load supplier:', err);
        setError('Failed to load supplier. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    void loadSupplier();
  }, [supplierId, router]);

  const handleArchive = async () => {
    if (!organizationId || !supplierId) return;

    if (!window.confirm('Are you sure you want to archive this supplier?')) {
      return;
    }

    setIsArchiving(true);
    try {
      await supplierApi.archiveSupplier(organizationId, supplierId);
      router.push('/suppliers' as any);
    } catch (err) {
      console.error('Failed to archive supplier', err);
      alert('Failed to archive supplier. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  if (!organizationId) {
    return null; // Redirecting
  }

  if (loading) {
    return <LoadingState message="Loading supplier details..." />;
  }

  if (error || !supplier) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <ErrorState
          message={error || 'Supplier not found'}
          onRetry={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const modules = [
    {
      title: 'Project Assignments',
      description: 'Projects this supplier is assigned to',
      icon: FolderKanban,
      color: 'text-purple-500',
    },
    {
      title: 'Tracking Links',
      description: 'Supplier entry links for routing traffic',
      icon: LinkIcon,
      color: 'text-blue-500',
    },
    {
      title: 'Supplier Performance',
      description: 'Conversion rates and traffic metrics',
      icon: Activity,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={'/suppliers' as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">{supplier.name}</span>
      </div>

      <div className="flex items-start justify-between space-y-2">
        <PageHeader title={supplier.name} description="Supplier Details" />
        <div className="flex items-center space-x-2">
          <Link
            href={`/suppliers/${supplier.id}/edit` as any}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted border shadow-sm h-9 px-4 py-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => void handleArchive()}
            disabled={isArchiving || supplier.status === 'ARCHIVED'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground border shadow-sm h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash className="mr-2 h-4 w-4" />
            Archive
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        {/* Basic Info */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(supplier.status)}`}
                >
                  {supplier.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Website</p>
                <p className="text-sm font-medium flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline line-clamp-1"
                    >
                      {supplier.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Created At</p>
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {new Date(supplier.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {new Date(supplier.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {supplier.notes && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Primary Contact</p>
                <p className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  {supplier.contactName || (
                    <span className="text-muted-foreground font-normal italic">Not provided</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {supplier.email ? (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-primary hover:underline line-clamp-1"
                    >
                      {supplier.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground font-normal italic">Not provided</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="hover:underline">
                      {supplier.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground font-normal italic">Not provided</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Supplier Modules</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="rounded-xl border bg-card text-card-foreground shadow opacity-70 transition-opacity"
              >
                <div className="p-6 flex flex-col items-center text-center space-y-2">
                  <div className={`p-3 rounded-full bg-muted ${module.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold">{module.title}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-2">
                    Coming Soon
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
