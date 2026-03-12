<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Student Created</DialogTitle>
        <DialogDescription>
          Save this temporary password. It will not be shown again.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">
          Account: {{ email }}
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
            {{ password }}
          </code>
          <Button variant="outline" size="sm" @click="copyPassword">
            Copy
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button @click="open = false">Done</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  email: string;
  password: string;
}>();

function copyPassword() {
  navigator.clipboard.writeText(props.password);
  toast.success("Password copied to clipboard");
}
</script>
