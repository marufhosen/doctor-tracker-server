import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { DoctorModel } from '../src/modules/doctors/doctor.model.js';
import { PatientModel } from '../src/modules/patients/patient.model.js';
import type { PatientGender } from '../src/modules/patients/patient.types.js';

const doctors = [
  ['Sarah Wilson', 'Cardiology', 'City General Hospital'],
  ['James Chen', 'Neurology', 'Northside Medical Center'],
  ['Olivia Bennett', 'Pediatrics', 'City General Hospital'],
  ['Michael Foster', 'Orthopedics', 'Westfield Hospital'],
  ['Emma Patel', 'Dermatology', 'Northside Medical Center'],
  ['Daniel Brooks', 'General Medicine', 'City General Hospital'],
  ['Sophia Martinez', 'Endocrinology', 'Westfield Hospital'],
  ['Ethan Williams', 'Gastroenterology', 'Riverside Clinic'],
  ['Ava Thompson', 'Pulmonology', 'Riverside Clinic'],
  ['Noah Anderson', 'Ophthalmology', 'Northside Medical Center'],
  ['Mia Robinson', 'Psychiatry', 'Westfield Hospital'],
  ['Lucas Green', 'Oncology', 'City General Hospital'],
] as const;

const patientNames = [
  'Emily Carter',
  'Noah Williams',
  'Sophia Miller',
  'Liam Anderson',
  'Ava Thompson',
  'Oliver Davis',
  'Isabella Moore',
  'Elijah Taylor',
  'Amelia Jackson',
  'James White',
  'Mia Harris',
  'Benjamin Martin',
  'Charlotte Garcia',
  'Lucas Martinez',
  'Harper Robinson',
  'Henry Clark',
  'Evelyn Rodriguez',
  'Alexander Lewis',
  'Abigail Lee',
  'Sebastian Walker',
  'Ella Hall',
  'Jack Allen',
  'Scarlett Young',
  'Owen Hernandez',
  'Grace King',
  'Theodore Wright',
  'Chloe Lopez',
  'Samuel Hill',
  'Victoria Scott',
  'Leo Adams',
  'Lily Baker',
  'Julian Nelson',
  'Hannah Carter',
  'David Mitchell',
  'Zoe Perez',
  'Isaac Roberts',
  'Nora Turner',
  'Gabriel Phillips',
  'Layla Campbell',
  'Dylan Parker',
  'Riley Evans',
  'Nathan Edwards',
  'Aria Collins',
  'Caleb Stewart',
  'Penelope Sanchez',
  'Ryan Morris',
  'Luna Rogers',
  'Thomas Reed',
] as const;

const conditions = [
  'Hypertension',
  'Arrhythmia',
  'Migraine',
  'Asthma',
  'Fracture recovery',
  'Eczema',
  'Type 2 diabetes',
  'Gastritis',
  'Seasonal allergies',
  'Glaucoma monitoring',
  'Anxiety',
  'Follow-up care',
] as const;

const genders: PatientGender[] = ['FEMALE', 'MALE', 'OTHER'];

const slug = (value: string): string =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '.');

const seedData = async (): Promise<void> => {
  try {
    await connectDatabase();

    const doctorEmails = doctors.map(
      ([name]) => `${slug(name)}@seed.doctor-tracker.test`,
    );
    const doctorResult = await DoctorModel.bulkWrite(
      doctors.map(([name, specialization, hospital], index) => {
        const email = `${slug(name)}@seed.doctor-tracker.test`;
        return {
          updateOne: {
            filter: { email },
            update: {
              $setOnInsert: {
                name: `Dr. ${name}`,
                specialization,
                hospital,
                phone: `+1 202 555 ${String(2000 + index)}`,
                email,
              },
            },
            upsert: true,
          },
        };
      }),
      { ordered: false },
    );

    const seededDoctors = await DoctorModel.find({
      email: { $in: doctorEmails },
    })
      .select({ _id: 1, email: 1 })
      .lean();
    const doctorIdByEmail = new Map(
      seededDoctors.map((doctor) => [doctor.email, doctor._id]),
    );

    if (doctorIdByEmail.size !== doctors.length) {
      throw new Error('Not all seed doctors could be resolved');
    }

    const patientResult = await PatientModel.bulkWrite(
      patientNames.map((name, index) => {
        const doctorEmail = doctorEmails[index % doctorEmails.length]!;
        const doctorId = doctorIdByEmail.get(doctorEmail);
        if (!doctorId) throw new Error(`Seed doctor is missing for ${name}`);

        const email = `${slug(name)}@seed.patient-tracker.test`;
        return {
          updateOne: {
            filter: { email },
            update: {
              $setOnInsert: {
                doctorId,
                name,
                condition: conditions[index % conditions.length]!,
                phone: `+1 202 555 ${String(3000 + index)}`,
                email,
                age: 18 + ((index * 7) % 65),
                gender: genders[index % genders.length]!,
                address: `${100 + index} Care Avenue`,
              },
            },
            upsert: true,
          },
        };
      }),
      { ordered: false },
    );

    logger.info(
      {
        doctorsCreated: doctorResult.upsertedCount,
        patientsCreated: patientResult.upsertedCount,
        doctorsAvailable: doctors.length,
        patientsAvailable: patientNames.length,
      },
      'Doctor and patient seed data is ready',
    );
  } catch (error) {
    logger.fatal({ err: error }, 'Doctor and patient data seed failed');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

void seedData();
