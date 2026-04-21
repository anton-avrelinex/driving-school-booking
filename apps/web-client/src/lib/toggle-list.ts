import type { Ref } from "vue";

export function makeToggle<T>(list: Ref<T[]>) {
  return (item: T, checked: boolean | "indeterminate") => {
    if (checked === true) {
      if (!list.value.includes(item)) list.value.push(item);
    } else {
      list.value = list.value.filter((x) => x !== item);
    }
  };
}
