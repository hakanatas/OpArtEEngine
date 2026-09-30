// Ortak zaman çizelgesi: müzik (tools/muzik.js) ve animasyon aynı tabloyu kullanır.
// 100 BPM -> 1 vuruş 0,6 sn, 1 ölçü 2,4 sn.
(function (root) {
  const BPM = 100;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const BOLUMLER = [
    { ad: 'kanca',   bas: 0,  bit: 4,  baslik: 'Kanca',                                  kod: '' },
    { ad: 'ussu',    bas: 4,  bit: 16, baslik: 'Üslü ve köklü gösterim',                 kod: 'MAT.9.1.1' },
    { ad: 'aralik',  bas: 16, bit: 26, baslik: 'Aralıklar ve küme işlemleri',            kod: 'MAT.9.1.2' },
    { ad: 'kumeler', bas: 26, bit: 36, baslik: 'Sayı kümeleri ve özellikleri',           kod: 'MAT.9.1.3' },
    { ad: 'cebir',   bas: 36, bit: 44, baslik: 'İşlem özelliklerinden cebire',           kod: 'MAT.9.1.4' },
    { ad: 'final',   bas: 44, bit: 48, baslik: 'Final',                                  kod: '' },
  ];
  BOLUMLER.forEach(b => { b.t0 = b.bas * BAR; b.t1 = b.bit * BAR; });
  const TOPLAM_OLCU = 48;
  const SURE = TOPLAM_OLCU * BAR + 1.5; // son akorun çınlaması
  const Z = { BPM, BEAT, BAR, BOLUMLER, TOPLAM_OLCU, SURE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Z; else root.ZAMAN = Z;
})(this);
