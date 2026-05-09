use anchor_lang::prelude::*;

declare_id!("QVERiFYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod qverify {
    use super::*;

    pub fn log_correction(
        ctx: Context<LogCorrection>,
        claim_hash: [u8; 32],
        message: [u8; 128],
    ) -> Result<()> {
        let log = &mut ctx.accounts.correction_log;
        log.claim_hash = claim_hash;
        log.subject = ctx.accounts.subject.key();
        log.message = message;
        log.timestamp = Clock::get()?.unix_timestamp;
        log.bump = ctx.bumps.correction_log;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(claim_hash: [u8; 32])]
pub struct LogCorrection<'info> {
    #[account(
        init,
        payer = subject,
        space = 8 + 32 + 32 + 128 + 8 + 1,
        seeds = [b"correction", subject.key().as_ref(), claim_hash.as_ref()],
        bump,
    )]
    pub correction_log: Account<'info, CorrectionLog>,

    #[account(mut)]
    pub subject: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct CorrectionLog {
    pub claim_hash: [u8; 32],   // SHA256 of the original AI claim
    pub subject: Pubkey,         // wallet of the person correcting
    pub message: [u8; 128],     // correction text, null-padded, 128 UTF-8 bytes max
    pub timestamp: i64,
    pub bump: u8,
}
// Space: 8 (discriminator) + 32 + 32 + 128 + 8 + 1 = 209 bytes
