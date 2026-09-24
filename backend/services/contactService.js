const Movement = require("../models/Movement");
const Contact = require("../models/Contact");


// ==========================================
// DETECT CONTACTS
// ==========================================

const detectContacts = async () => {

  const movements =
    await Movement.find({
      action: "ENTRY",
      exitTime: { $ne: null }
    }).sort({
      entryTime: 1
    });


  const contacts = [];


  // ==========================================
  // COMPARE MOVEMENTS
  // ==========================================

  for (
    let i = 0;
    i < movements.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < movements.length;
      j++
    ) {

      const a = movements[i];
      const b = movements[j];


      // Different locations
      if (
        a.locationId !==
        b.locationId
      ) {
        continue;
      }


      // Same person
      if (
        a.personId ===
        b.personId
      ) {
        continue;
      }


      // ========================================
      // OVERLAPPING TIME
      // ========================================

      const start = new Date(
        Math.max(
          new Date(
            a.entryTime
          ).getTime(),

          new Date(
            b.entryTime
          ).getTime()
        )
      );


      const end = new Date(
        Math.min(
          new Date(
            a.exitTime
          ).getTime(),

          new Date(
            b.exitTime
          ).getTime()
        )
      );


      // No overlap
      if (
        start >= end
      ) {
        continue;
      }


      // ========================================
      // DURATION
      // ========================================

      const duration =
        Math.floor(
          (end - start) / 1000
        );


      // ========================================
      // CHECK DUPLICATE
      // ========================================

      const existing =
        await Contact.findOne({
          person1Id:
            a.personId,

          person2Id:
            b.personId,

          locationId:
            a.locationId,

          startTime:
            start,

          endTime:
            end
        });


      if (existing) {
        continue;
      }


      // ========================================
      // ADD CONTACT
      // ========================================

      contacts.push({

        person1Id:
          a.personId,

        person2Id:
          b.personId,

        locationId:
          a.locationId,

        startTime:
          start,

        endTime:
          end,

        duration

      });

    }
  }


  // ==========================================
  // SAVE NEW CONTACTS
  // ==========================================

  if (
    contacts.length > 0
  ) {

    await Contact.insertMany(
      contacts
    );

  }


  return contacts;
};


module.exports = {
  detectContacts
};