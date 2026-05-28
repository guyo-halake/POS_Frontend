import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'default';
      case 'SALE': return 'secondary';
      case 'INVENTORY_ADD': return 'outline';
      case 'INVENTORY_DELETE': return 'destructive';
      case 'INVENTORY_UPDATE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">{log.user_name || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action) as any} className="text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
