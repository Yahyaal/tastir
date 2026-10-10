# Bou Inania Tutorials Comparison (2026-10-09)

## Executive Summary

**Recommendation: Keep both tutorials as they serve different purposes, but consider the rosette tutorial as the more reliable reference for the rosette itself.**

The two Bou Inania tutorials are **complementary, not duplicates**:

1. **bou-inania-rosette** (14 steps): Focuses on the twelve-fold rosette with overlapping frame bands, following @aslam.geometricpatterns' drawing using Samira Mian's method
2. **bou-inania-twelve-fold-wall** (18 steps): Full wall pattern including rosettes, corner stars, and grid bands

## Detailed Comparison

### Structure

| Aspect | Rosette | Wall |
|--------|---------|------|
| **Steps** | 14 | 18 |
| **Tile Type** | Square with overlapping panel | Square edge-to-edge |
| **Panel** | Yes (4 vertices) | No |
| **Cell Area** | 17.0392 | 4.0000 |
| **Pieces per Cell** | 100 | 120 |
| **Piece Types** | 14 | 16 |
| **Palette** | Fès tile | Alhambra |
| **Level** | Advanced | Advanced |

### Piece Breakdown

**Rosette Tutorial:**
- Largest piece: 24v star (0.34648 area, 1 per cell)
- Focus: Rosette center with shields, petals, pentagons
- Has "hourglass" piece (12v, marked small)
- Total 100 pieces filling overlapping panel

**Wall Tutorial:**
- Largest piece: 24v centre (0.08108 area, 1 per cell)  
- Includes: Corner stars (16v), ring pieces (ringaxis + ringbend), grid elements
- Smaller pieces overall due to non-overlapping tiles
- Total 120 pieces filling unit square

### Reliability Assessment

**bou-inania-rosette:**
- ✅ Based on real drawing by @aslam.geometricpatterns
- ✅ Uses Samira Mian's published construction method
- ✅ Approved by owner (5 Oct 2026)
- ⚠️  One known difference: shield band not drawn in tutorial
- **Status**: RELIABLE reference for rosette construction

**bou-inania-twelve-fold-wall:**
- ⚠️  AI-generated from fuzzy photo with no published construction
- ⚠️  Simplified from 21-step overcomplicated original
- ⚠️  Ring cut was wrong and corrected based on external review
- ⚠️  Line distances were fitted to photo, not derived from tradition
- **Status**: UNRELIABLE as reference, treat as educated guess

### Verification Status

**Rosette:**
- Compared against @aslam drawing: Close match
- Photo comparison: STATUS.md notes shield band difference
- Construction method: Published (Samira Mian)

**Wall:**
- Compared against photo: Owner questions line centering
- Original had wrong ring cuts (8 equal vs 4+4)
- Construction method: Fitted/guessed from photo
- Needs proper centerline verification

## Recommendation

### Keep Both But With Clear Roles:

1. **For learning the twelve-fold rosette construction**: Use `bou-inania-rosette`
   - More reliable source (real drawing)
   - Published construction method  
   - Focus on rosette fundamentals
   
2. **For full wall layout understanding**: Use `bou-inania-twelve-fold-wall` with caution
   - Shows corner stars and grid integration
   - But treat proportions as approximate
   - May need refinement based on rosette tutorial

### If Only One Can Be Kept:

Keep `bou-inania-rosette` - it's the reliable reference following a published construction from a clear drawing.

### Action Items for Wall Tutorial:

1. ✅ Arabic title fixed (both now say twelve-fold)
2. 🔄 IN PROGRESS: Proper centerline verification against photo
3. TODO: Consider rebuilding wall using rosette tutorial's proportions
4. TODO: Document clearly in credits that this is a fitted reconstruction

## Next Steps

Performing detailed centerline extraction and measurement to:
1. Measure both tutorials' ink lines against photo band centerlines
2. Identify which line families in wall tutorial are off-center
3. Determine if rosette tutorial's proportions would improve wall accuracy
