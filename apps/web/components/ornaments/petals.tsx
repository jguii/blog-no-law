import styles from './petals.module.css';

// Pétalas que caem devagar só na capa (D-20): 6 no desktop e 3 no celular (as três últimas só
// aparecem de `md` para cima). Decorativas: contêiner `aria-hidden`, sem estilo inline (CSP); a
// posição e o ritmo de cada uma ficam no CSS module.
const NO_CELULAR = 'hidden md:block';

export function Petals() {
  return (
    <div aria-hidden="true" className={styles.camada}>
      <span className={styles.petala} />
      <span className={styles.petala} />
      <span className={styles.petala} />
      <span className={`${styles.petala} ${NO_CELULAR}`} />
      <span className={`${styles.petala} ${NO_CELULAR}`} />
      <span className={`${styles.petala} ${NO_CELULAR}`} />
    </div>
  );
}
