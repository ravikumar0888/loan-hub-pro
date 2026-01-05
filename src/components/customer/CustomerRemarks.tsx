import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { customersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerRemarksProps {
  customerId: string;
}

export default function CustomerRemarks({ customerId }: CustomerRemarksProps) {
  const [newRemark, setNewRemark] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer remarks
  const { data: remarksData, isLoading } = useQuery({
    queryKey: ['customer-remarks', customerId],
    queryFn: () => customersApi.getCustomerRemarks(customerId),
  });

  // Add remark mutation
  const addRemarkMutation = useMutation({
    mutationFn: (remark: string) => customersApi.addRemark(customerId, remark),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Remark added successfully',
      });
      setNewRemark('');
      queryClient.invalidateQueries({ queryKey: ['customer-remarks', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add remark',
        variant: 'destructive',
      });
    },
  });

  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a remark',
        variant: 'destructive',
      });
      return;
    }
    addRemarkMutation.mutate(newRemark);
  };

  const remarks = remarksData?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        <span>Remarks ({remarks.length})</span>
      </div>

      {/* Add New Remark */}
      <div className="space-y-2">
        <Textarea
          value={newRemark}
          onChange={(e) => setNewRemark(e.target.value)}
          placeholder="Add a new remark..."
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleAddRemark}
          disabled={addRemarkMutation.isPending || !newRemark.trim()}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Send className="h-4 w-4 mr-2" />
          {addRemarkMutation.isPending ? 'Adding...' : 'Add Remark'}
        </Button>
      </div>

      {/* Remarks List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading remarks...
          </div>
        ) : remarks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No remarks yet. Add the first one above.
          </div>
        ) : (
          remarks.map((remark: any) => (
            <div
              key={remark.id}
              className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border"
            >
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {remark.remark}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {remark.user
                    ? `${remark.user.firstName} ${remark.user.lastName}`
                    : 'Unknown User'}
                </span>
                <span>
                  {format(new Date(remark.createdAt), 'MMM dd, yyyy hh:mm a')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
