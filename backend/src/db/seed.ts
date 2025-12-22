import { db } from './index.js';
import {
  patients,
  departments,
  doctors,
  schedules,
} from './schema.js';

async function seed() {
  console.log('🌱 Seeding database with US hospital data...');

  // Clear existing data (ignore errors if tables don't exist yet)
  console.log('Clearing existing data...');
  try {
    await db.delete(schedules);
    await db.delete(doctors);
    await db.delete(departments);
    await db.delete(patients);
  } catch (error) {
    console.log('⚠️  Tables may not exist yet, skipping deletion');
  }

  // Insert departments
  console.log('Inserting departments...');
  const depts = await db
    .insert(departments)
    .values([
      {
        code: 'CARDIO',
        name: 'Cardiology',
        description: 'Heart and cardiovascular system',
      },
      {
        code: 'ORTHO',
        name: 'Orthopedics',
        description: 'Bones, joints, and muscles',
      },
      {
        code: 'DERM',
        name: 'Dermatology',
        description: 'Skin, hair, and nails',
      },
      {
        code: 'NEURO',
        name: 'Neurology',
        description: 'Brain and nervous system',
      },
      {
        code: 'PEDS',
        name: 'Pediatrics',
        description: 'Healthcare for children',
      },
    ])
    .returning();
  console.log(`✓ Inserted ${depts.length} departments`);

  // Get department IDs for reference
  const cardioId = depts.find((d) => d.code === 'CARDIO')!.id;
  const orthoId = depts.find((d) => d.code === 'ORTHO')!.id;
  const dermId = depts.find((d) => d.code === 'DERM')!.id;
  const neuroId = depts.find((d) => d.code === 'NEURO')!.id;
  const pedsId = depts.find((d) => d.code === 'PEDS')!.id;

  // Insert doctors (2-3 per department)
  console.log('Inserting doctors...');
  const docs = await db
    .insert(doctors)
    .values([
      // Cardiology (3 doctors)
      {
        departmentId: cardioId,
        doctorNumber: 'D001',
        name: 'Dr. Sarah Johnson',
        specialization: 'Interventional Cardiology',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      {
        departmentId: cardioId,
        doctorNumber: 'D002',
        name: 'Dr. Robert Martinez',
        specialization: 'Heart Failure',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: false,
      },
      {
        departmentId: cardioId,
        doctorNumber: 'D003',
        name: 'Dr. Amanda Lewis',
        specialization: 'Preventive Cardiology',
        acceptsNewPatients: false,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      // Orthopedics (3 doctors)
      {
        departmentId: orthoId,
        doctorNumber: 'D004',
        name: 'Dr. Michael Chen',
        specialization: 'Sports Medicine',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      {
        departmentId: orthoId,
        doctorNumber: 'D005',
        name: 'Dr. Lisa Thompson',
        specialization: 'Joint Replacement',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: false,
      },
      {
        departmentId: orthoId,
        doctorNumber: 'D006',
        name: 'Dr. Kevin Park',
        specialization: 'Spine Surgery',
        acceptsNewPatients: false,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      // Dermatology (2 doctors)
      {
        departmentId: dermId,
        doctorNumber: 'D007',
        name: 'Dr. Emily Williams',
        specialization: 'Cosmetic Dermatology',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      {
        departmentId: dermId,
        doctorNumber: 'D008',
        name: 'Dr. Daniel Kim',
        specialization: 'Skin Cancer',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      // Neurology (2 doctors)
      {
        departmentId: neuroId,
        doctorNumber: 'D009',
        name: 'Dr. James Rodriguez',
        specialization: 'Epilepsy and Seizures',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: false,
      },
      {
        departmentId: neuroId,
        doctorNumber: 'D010',
        name: 'Dr. Michelle Wong',
        specialization: 'Stroke and Movement Disorders',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      // Pediatrics (2 doctors)
      {
        departmentId: pedsId,
        doctorNumber: 'D011',
        name: 'Dr. Jennifer Lee',
        specialization: 'General Pediatrics',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: true,
      },
      {
        departmentId: pedsId,
        doctorNumber: 'D012',
        name: 'Dr. Christopher Davis',
        specialization: 'Pediatric Cardiology',
        acceptsNewPatients: true,
        acceptsFollowUp: true,
        acceptsCheckup: false,
      },
    ])
    .returning();
  console.log(`✓ Inserted ${docs.length} doctors`);

  // Get doctor IDs
  const d001 = docs.find((d) => d.doctorNumber === 'D001')!.id;
  const d002 = docs.find((d) => d.doctorNumber === 'D002')!.id;
  const d003 = docs.find((d) => d.doctorNumber === 'D003')!.id;
  const d004 = docs.find((d) => d.doctorNumber === 'D004')!.id;
  const d005 = docs.find((d) => d.doctorNumber === 'D005')!.id;
  const d006 = docs.find((d) => d.doctorNumber === 'D006')!.id;
  const d007 = docs.find((d) => d.doctorNumber === 'D007')!.id;
  const d008 = docs.find((d) => d.doctorNumber === 'D008')!.id;
  const d009 = docs.find((d) => d.doctorNumber === 'D009')!.id;
  const d010 = docs.find((d) => d.doctorNumber === 'D010')!.id;
  const d011 = docs.find((d) => d.doctorNumber === 'D011')!.id;
  const d012 = docs.find((d) => d.doctorNumber === 'D012')!.id;

  // Insert schedules
  console.log('Inserting schedules...');
  const scheduleData = [];

  // Dr. Sarah Johnson (D001): Mon/Wed/Fri 8AM-5PM
  for (const day of [1, 3, 5]) {
    for (const hour of [8, 9, 10, 11, 13, 14, 15, 16, 17]) {
      scheduleData.push({ doctorId: d001, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Robert Martinez (D002): Tue/Thu/Fri 9AM-6PM
  for (const day of [2, 4, 5]) {
    for (const hour of [9, 10, 11, 13, 14, 15, 16, 17, 18]) {
      scheduleData.push({ doctorId: d002, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Amanda Lewis (D003): Mon/Tue/Wed 1PM-6PM
  for (const day of [1, 2, 3]) {
    for (const hour of [13, 14, 15, 16, 17, 18]) {
      scheduleData.push({ doctorId: d003, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Michael Chen (D004): Tue/Thu 9AM-6PM
  for (const day of [2, 4]) {
    for (const hour of [9, 10, 11, 13, 14, 15, 16, 17, 18]) {
      scheduleData.push({ doctorId: d004, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Lisa Thompson (D005): Mon/Wed/Fri 8AM-5PM
  for (const day of [1, 3, 5]) {
    for (const hour of [8, 9, 10, 11, 13, 14, 15, 16, 17]) {
      scheduleData.push({ doctorId: d005, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Kevin Park (D006): Mon-Fri 9AM-3PM
  for (const day of [1, 2, 3, 4, 5]) {
    for (const hour of [9, 10, 11, 13, 14, 15]) {
      scheduleData.push({ doctorId: d006, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Emily Williams (D007): Mon-Fri 9AM-6PM
  for (const day of [1, 2, 3, 4, 5]) {
    for (const hour of [9, 10, 11, 13, 14, 15, 16, 17, 18]) {
      scheduleData.push({ doctorId: d007, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Daniel Kim (D008): Tue/Wed/Thu 10AM-5PM
  for (const day of [2, 3, 4]) {
    for (const hour of [10, 11, 13, 14, 15, 16, 17]) {
      scheduleData.push({ doctorId: d008, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. James Rodriguez (D009): Mon/Tue/Wed 8AM-12PM
  for (const day of [1, 2, 3]) {
    for (const hour of [8, 9, 10, 11, 12]) {
      scheduleData.push({ doctorId: d009, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Michelle Wong (D010): Thu/Fri 1PM-7PM
  for (const day of [4, 5]) {
    for (const hour of [13, 14, 15, 16, 17, 18, 19]) {
      scheduleData.push({ doctorId: d010, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Jennifer Lee (D011): Mon/Wed/Fri 9AM-4PM
  for (const day of [1, 3, 5]) {
    for (const hour of [9, 10, 11, 13, 14, 15, 16]) {
      scheduleData.push({ doctorId: d011, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  // Dr. Christopher Davis (D012): Tue/Thu 8AM-2PM
  for (const day of [2, 4]) {
    for (const hour of [8, 9, 10, 11, 13, 14]) {
      scheduleData.push({ doctorId: d012, dayOfWeek: day, timeSlot: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true });
    }
  }

  await db.insert(schedules).values(scheduleData);
  console.log(`✓ Inserted ${scheduleData.length} schedule slots`);

  // Insert patients
  console.log('Inserting patients...');
  const pts = await db
    .insert(patients)
    .values([
      { patientNumber: 'P001', name: 'John Smith', phone: '555-0101', dateOfBirth: '1985-03-15' },
      { patientNumber: 'P002', name: 'Maria Garcia', phone: '555-0102', dateOfBirth: '1990-07-22' },
      { patientNumber: 'P003', name: 'David Kim', phone: '555-0103', dateOfBirth: '1978-11-08' },
      { patientNumber: 'P004', name: 'Jessica Brown', phone: '555-0104', dateOfBirth: '1995-02-14' },
      { patientNumber: 'P005', name: 'Robert Taylor', phone: '555-0105', dateOfBirth: '1982-09-30' },
      { patientNumber: 'P006', name: 'Emily Anderson', phone: '555-0106', dateOfBirth: '1988-05-19' },
      { patientNumber: 'P007', name: 'Michael Johnson', phone: '555-0107', dateOfBirth: '1992-12-03' },
      { patientNumber: 'P008', name: 'Sarah Wilson', phone: '555-0108', dateOfBirth: '1980-08-27' },
      { patientNumber: 'P009', name: 'James Martinez', phone: '555-0109', dateOfBirth: '1975-01-11' },
      { patientNumber: 'P010', name: 'Linda Davis', phone: '555-0110', dateOfBirth: '1998-04-08' },
    ])
    .returning();
  console.log(`✓ Inserted ${pts.length} patients`);

  console.log('✅ Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   Departments: ${depts.length}`);
  console.log(`   Doctors: ${docs.length}`);
  console.log(`   Schedule slots: ${scheduleData.length}`);
  console.log(`   Patients: ${pts.length}`);
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
