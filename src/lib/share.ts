/**
 * Opens the phone's share sheet where there is one; otherwise copies the link. Returns whether the
 * link was copied, or null when the share sheet handled it. A modal dialog traps focus, so a caller
 * inside one passes it as `container` for the copy fallback to work.
 */
export async function shareLink(data: { title: string; text: string; url: string }, container: HTMLElement = document.body): Promise<boolean | null> {
  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
    return null;
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return true;
  } catch {
    // Older or stricter browsers: copy through a hidden text field instead.
    const field = document.createElement("textarea");
    field.value = data.url;
    field.style.position = "fixed";
    field.style.opacity = "0";
    container.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}
