# LocalGrow Security Specification & Red Team Audit

## 1. Data Invariants
1. **User Profile & PII Isolation**: A `/users/{userId}` document may only be read or written by the authenticated, email-verified user whose `uid` equals `userId`. No blanket `list` is permitted on `/users`.
2. **Claim Integrity & Terminal Redemption**: A `/users/{userId}/claims/{claimId}` document cannot exist without a valid parent `/users/{userId}` document and an existing `/offers/{offerId}` document. Once `redeemedInStore` becomes `true`, it is locked and cannot be reverted to `false`.
3. **Loyalty Card Integrity**: A `/users/{userId}/loyaltyCards/{programId}` document must reference an existing `/loyaltyPrograms/{programId}` document, and `currentStamps` must stay within `0 <= currentStamps <= visitsRequired`.
4. **Offer Ownership & Action-Based Engagement**: Only the verified creator (`ownerId == request.auth.uid`) may edit, pause, or delete an `/offers/{offerId}` document. Other verified users may only increment `views`, `claims`, or `whatsappShares` by exactly `+1` via explicit `affectedKeys().hasOnly(...)` action branches.
5. **Loyalty Program Ownership**: Only the verified creator (`ownerId == request.auth.uid`) may create, edit, or delete `/loyaltyPrograms/{programId}`.
6. **Feedback Authenticity**: `/feedback/{feedbackId}` stores zero PII (no email/phone) and requires `userId == request.auth.uid` and `createdAt == request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Email Create**: Creating an offer while `request.auth.token.email_verified == false`.
2. **Identity Spoofing on Offer**: Creating `/offers/bad-1` with `ownerId: "victim-uid"` != `request.auth.uid`.
3. **Shadow Field Injection on User**: Updating `/users/{uid}` with an extra ghost key `isAdmin: true`.
4. **PII Cross-Read**: Signed-in user A attempting `get(/users/user-B)`.
5. **Client Timestamp Forgery**: Creating `/offers/bad-2` with a backdated `createdAt` instead of `request.time`.
6. **Orphaned Claim**: Creating `/users/{uid}/claims/c1` referencing non-existent `offerId: "fake-offer-999"`.
7. **Terminal State Rollback**: Updating `/users/{uid}/claims/c1` from `redeemedInStore: true` back to `false`.
8. **Arbitrary Price Manipulation by Non-Owner**: Non-owner attempting to update `offerPrice: 1` on someone else's offer.
9. **Counter Jump Attack**: Non-owner attempting `claims: existing.claims + 500` in one write.
10. **ID Poisoning**: Creating `/offers/` with a 300-character or special-character document ID (`../../etc/passwd`).
11. **Unbounded String / Denial-of-Wallet**: Creating `/feedback/f1` with a 10,000-character `comment` exceeding `maxLength: 400`.
12. **Array Overflow**: Creating `/offers/bad-3` with 25 elements in `reviews` (exceeding max 10) or non-map elements.
