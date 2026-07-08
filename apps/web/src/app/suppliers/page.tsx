/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Users, Search, Mail } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { supplierApi } from '@/lib/supplier-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSuppliers = useCallback(async (orgId: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierApi.listSuppliers(orgId, { search });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);
    void loadSuppliers(orgId);
  }, [router, loadSuppliers]);

  // Debounce search
  useEffect(() => {
    if (!organizationId) return;
    const timer = setTimeout(() => {
      void loadSuppliers(organizationId, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, organizationId, loadSuppliers]);

  if (!organizationId) {
    return null; // Redirecting to /organizations
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Suppliers" description="Manage survey traffic suppliers and partners." />
        <div className="flex items-center space-x-2">
          <Link
            href={'/suppliers/new' as any}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search suppliers..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && suppliers.length === 0 ? (
        <LoadingState message="Loading suppliers..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => void loadSuppliers(organizationId, searchQuery)}
        />
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No suppliers found</h2>
            <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Add your first supplier to start receiving respondent traffic.'}
            </p>
            {!searchQuery && (
              <Link
                href={'/suppliers/new' as any}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suppliers.map((supplier) => (
            <Link
              href={`/suppliers/${supplier.id}` as any}
              key={supplier.id}
              className="block group h-full"
            >
              <div className="rounded-xl border bg-card text-card-foreground shadow transition-all group-hover:border-primary/50 group-hover:shadow-md h-full flex flex-col p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {supplier.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(supplier.status)}`}
                  >
                    {supplier.status}
                  </span>
                </div>

                <div className="space-y-2 mt-auto pt-4 flex-1">
                  {supplier.contactName && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{supplier.contactName}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{supplier.email}</span>
                    </div>
                  )}
                  {!supplier.contactName && !supplier.email && (
                    <p className="text-sm text-muted-foreground italic">No contact info provided</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
