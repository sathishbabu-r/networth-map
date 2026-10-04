export function buildMapShareText(
  actionCount: number,
  reviewCount: number,
): string {
  const actions = `${actionCount} action${actionCount === 1 ? "" : "s"}`;
  const reviews = `${reviewCount} additional area${reviewCount === 1 ? "" : "s"}`;

  return `I mapped my wealth, Vision and next moves with Networth MAP. I now have ${actions} assessed and ${reviews} to review. Build yours in about 20 minutes.`;
}
