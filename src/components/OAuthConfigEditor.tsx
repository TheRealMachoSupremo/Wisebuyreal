import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OAuthConfigEditorProps {
  clientId: string;
  redirectUri: string;
  onSave: (clientId: string, redirectUri: string) => void;
}

const OAuthConfigEditor: React.FC<OAuthConfigEditorProps> = ({
  clientId,
  redirectUri,
  onSave
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editClientId, setEditClientId] = useState(clientId);
  const [editRedirectUri, setEditRedirectUri] = useState(redirectUri);
  const { toast } = useToast();

  const handleSave = () => {
    if (!editClientId.trim()) {
      toast({
        title: 'Error',
        description: 'Client ID cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (!editRedirectUri.trim()) {
      toast({
        title: 'Error',
        description: 'Redirect URI cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    try {
      new URL(editRedirectUri);
    } catch {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL for Redirect URI',
        variant: 'destructive'
      });
      return;
    }

    onSave(editClientId.trim(), editRedirectUri.trim());
    setIsOpen(false);
    toast({
      title: 'Success',
      description: 'OAuth configuration updated successfully'
    });
  };

  const handleCancel = () => {
    setEditClientId(clientId);
    setEditRedirectUri(redirectUri);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Config
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit OAuth Configuration</DialogTitle>
            <DialogDescription>
              Update the Rapaport OAuth client ID and redirect URI settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Client ID
              </Label>
              <Input
                id="clientId"
                value={editClientId}
                onChange={(e) => setEditClientId(e.target.value)}
                className="col-span-3"
                placeholder="Enter client ID"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="redirectUri" className="text-right">
                Redirect URI
              </Label>
              <Input
                id="redirectUri"
                value={editRedirectUri}
                onChange={(e) => setEditRedirectUri(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/callback"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OAuthConfigEditor;