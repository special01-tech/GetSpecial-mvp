export function hasRealBrandColor(profile: any): boolean {
  if (!profile) return false;
  const color =
    profile.brandColor ||
    profile.primaryColor ||
    profile.creative_preferences?.primaryColor ||
    profile.creativePreferences?.primaryColor ||
    (Array.isArray(profile.brandColors) ? profile.brandColors[0] : null);
  return Boolean(color && typeof color === 'string' && color.startsWith('#'));
}

export function resolvePalette(profile: any): { primary: string; accent: string; text: string } {
  const primary =
    profile?.brandColor ||
    profile?.primaryColor ||
    profile?.creative_preferences?.primaryColor ||
    profile?.creativePreferences?.primaryColor ||
    (Array.isArray(profile?.brandColors) ? profile.brandColors[0] : '#FF5A00');
  const accent =
    profile?.accentColor ||
    profile?.creative_preferences?.accentColor ||
    profile?.creativePreferences?.accentColor ||
    (Array.isArray(profile?.brandColors) && profile.brandColors.length > 1 ? profile.brandColors[1] : '#F59E0B');
  const text = profile?.textColor || '#FFFFFF';
  return { primary, accent, text };
}
