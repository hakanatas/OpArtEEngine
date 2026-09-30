// Ortak zaman çizelgesi: müzik (tools/muzik.js) ve animasyon aynı tabloyu kullanır.
// 100 BPM -> 1 vuruş 0,6 sn, 1 ölçü 2,4 sn.
(function (root) {
  const BPM = 100;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  // tema: [sahne içi saniye, zemin] listesi; zemin değişince arka plan yumuşakça geçer
  const BOLUMLER = [
    { ad: 'kanca',   bas: 0,  bit: 4,  baslik: 'Kanca',                        kod: '',          tema: [[0, 'kara']] },
    { ad: 'ussu',    bas: 4,  bit: 16, baslik: 'Üslü ve köklü gösterim',       kod: 'MAT.9.1.1', tema: [[0, 'gece'], [10.8, 'defter'], [16.2, 'kraft']] },
    { ad: 'ozet1',   bas: 16, bit: 19, baslik: 'Ana fikir',                    kod: 'MAT.9.1.1', tema: [[0, 'renk:#ffd84d']] },
    { ad: 'aralik',  bas: 19, bit: 29, baslik: 'Aralıklar ve küme işlemleri',  kod: 'MAT.9.1.2', tema: [[0, 'defter'], [8.4, 'kara'], [16.8, 'plan']] },
    { ad: 'ozet2',   bas: 29, bit: 32, baslik: 'Ana fikir',                    kod: 'MAT.9.1.2', tema: [[0, 'renk:#ff9cc0']] },
    { ad: 'kumeler', bas: 32, bit: 42, baslik: 'Sayı kümeleri ve özellikleri', kod: 'MAT.9.1.3', tema: [[0, 'defter'], [9.6, 'kraft'], [13.2, 'gece'], [19.2, 'defter']] },
    { ad: 'ozet3',   bas: 42, bit: 45, baslik: 'Ana fikir',                    kod: 'MAT.9.1.3', tema: [[0, 'renk:#8fd6ff']] },
    { ad: 'cebir',   bas: 45, bit: 53, baslik: 'İşlem özelliklerinden cebire', kod: 'MAT.9.1.4', tema: [[0, 'kara'], [7.2, 'plan'], [13.2, 'defter']] },
    { ad: 'ozet4',   bas: 53, bit: 56, baslik: 'Ana fikir',                    kod: 'MAT.9.1.4', tema: [[0, 'renk:#97e8ad']] },
    { ad: 'final',   bas: 56, bit: 61, baslik: 'Final',                        kod: '',          tema: [[0, 'defter']] },
  ];
  BOLUMLER.forEach(b => { b.t0 = b.bas * BAR; b.t1 = b.bit * BAR; });
  const TOPLAM_OLCU = 61;
  const SURE = TOPLAM_OLCU * BAR + 1.5; // son akorun çınlaması
  const Z = { BPM, BEAT, BAR, BOLUMLER, TOPLAM_OLCU, SURE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Z; else root.ZAMAN = Z;
})(this);
