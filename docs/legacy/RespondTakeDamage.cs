public override void RespondTakeDamage(int typeDamage, float AditionalknockbackForceX, float AditionalknockbackForceY)
{
    if (isInvulnerable || isDead) return;

    GetComponentInChildren<IgnoreCollisionOnDamage>()?.TriggerIgnoreCollision();

    EventInstance soundInstance = RuntimeManager.CreateInstance(typeDamage == 2 ? soundShoot : soundSlash);

    switch (typeDamage)
    {
        case 0:
            // hit crouch melee
            break;
        case 1:
            // hit normal melee
            soundInstance.setPitch(UnityEngine.Random.Range(0.8f, 1.2f));
            soundInstance.start();
            soundInstance.release();
            break;
        case 2:
            // shoot
            soundInstance.start();
            soundInstance.release();
            break;
    }
    if (!isRained && enemyStats.hp <= enemyStats.maxHp / 2)
    {
        if (!isAttacking && !isTransitioning) { StartCoroutine(DropHat()); }
        else { shouldTransition = true; }
    }
    if (enemyStats.hp <= 0)
    {
        isDead = true;
        if (enemyStats.isExecutavel && !isExecutada)
        {
            StartCoroutine(ExecutavelPosAtk());
        }
        else if (enemyStats.isDefeated && isExecutada)
        {
            animator.SetTrigger("Derrotado");
        }
    }
}
